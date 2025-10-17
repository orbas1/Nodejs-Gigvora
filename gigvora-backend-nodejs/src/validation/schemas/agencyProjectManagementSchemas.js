import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import { PROJECT_STATUSES, PROJECT_AUTOMATCH_DECISION_STATUSES } from '../../models/projectGigManagementModels.js';

function toPositiveInteger(value, ctx, { fieldName }) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive integer.` });
    return z.NEVER;
  }
  return numeric;
}

function pruneUndefined(object) {
  if (!object || typeof object !== 'object') {
    return undefined;
  }
  return Object.entries(object).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = pruneUndefined(value);
      if (nested && Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function parsePositiveInteger(value, ctx, { fieldName, max = Number.MAX_SAFE_INTEGER, allowZero = false }) {
  if (value === '' || value == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is required.` });
    return z.NEVER;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || (!allowZero && numeric <= 0) || numeric > max) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive whole number.` });
    return z.NEVER;
  }
  return numeric;
}

function parseOptionalPositiveInteger(value, ctx, { fieldName, max = Number.MAX_SAFE_INTEGER, allowZero = false }) {
  if (value === '' || value == null) {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || (!allowZero && numeric <= 0) || numeric > max) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive whole number.` });
    return z.NEVER;
  }
  return numeric;
}

function parseSkillsArray(value, ctx, { required }) {
  if (value == null) {
    if (required) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide at least one skill tag.' });
      return z.NEVER;
    }
    return undefined;
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

  const cleaned = rawValues
    .map((item) => `${item}`.trim().toLowerCase())
    .filter((item) => item.length > 0 && item.length <= 80)
    .slice(0, 50);

  const unique = Array.from(new Set(cleaned));

  if (!unique.length) {
    if (required) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide at least one skill tag.' });
      return z.NEVER;
    }
    return [];
  }

  return unique;
}

const projectStatusSchema = optionalTrimmedString({ max: 60 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !PROJECT_STATUSES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must be a valid project status.' });
    }
  });

const lifecycleStateSchema = optionalTrimmedString({ max: 10 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !['open', 'closed'].includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lifecycleState must be either open or closed.' });
    }
  });

const optionalIsoCurrencySchema = optionalTrimmedString({ max: 3, toUpperCase: true })
  .transform((value) => value ?? undefined)
  .superRefine((value, ctx) => {
    if (value && !/^[A-Z]{3}$/.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'budgetCurrency must be a valid ISO-4217 code.' });
    }
  });

const autoMatchStatusSchema = optionalTrimmedString({ max: 20 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !PROJECT_AUTOMATCH_DECISION_STATUSES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must be pending, accepted, or rejected.' });
    }
  });

const skillsArraySchema = z
  .any()
  .transform((value, ctx) => parseSkillsArray(value, ctx, { required: true }));

const optionalSkillsArraySchema = z
  .any()
  .transform((value, ctx) => parseSkillsArray(value, ctx, { required: false }));

const autoMatchSettingsSchema = z
  .object({
    enabled: optionalBoolean(),
    autoAcceptEnabled: optionalBoolean(),
    autoRejectEnabled: optionalBoolean(),
    budgetMin: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    budgetMax: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    weeklyHoursMin: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    weeklyHoursMax: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    durationWeeksMin: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    durationWeeksMax: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    skills: optionalStringArray({ maxItemLength: 80, maxLength: 50 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
  })
  .strip()
  .optional()
  .transform((value) => pruneUndefined(value));

const autoMatchFreelancerCreateSchema = z
  .object({
    freelancerId: z.any().transform((value, ctx) => toPositiveInteger(value, ctx, { fieldName: 'freelancerId' })),
    freelancerName: requiredTrimmedString({ max: 180 }),
    freelancerRole: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    autoMatchEnabled: optionalBoolean(),
    status: autoMatchStatusSchema,
    score: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip()
  .transform((value) => pruneUndefined(value));

const autoMatchFreelancerUpdateSchema = z
  .object({
    autoMatchEnabled: optionalBoolean(),
    status: autoMatchStatusSchema,
    score: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
  })
  .strip()
  .transform((value) => pruneUndefined(value));

const optionalDateString = optionalTrimmedString({ max: 30 }).transform((value) => value ?? undefined);

export const createProjectBodySchema = z
  .object({
    title: requiredTrimmedString({ min: 3, max: 180 }),
    description: requiredTrimmedString({ min: 10, max: 5000 }),
    category: requiredTrimmedString({ min: 2, max: 120 }),
    skills: skillsArraySchema,
    durationWeeks: z
      .any()
      .transform((value, ctx) => parsePositiveInteger(value, ctx, { fieldName: 'durationWeeks', max: 520 })),
    status: projectStatusSchema,
    lifecycleState: lifecycleStateSchema,
    startDate: optionalDateString,
    dueDate: optionalDateString,
    budgetCurrency: optionalIsoCurrencySchema,
    budgetAllocated: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
    autoMatch: autoMatchSettingsSchema,
  })
  .strip();

export const updateProjectBodySchema = z
  .object({
    title: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    category: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    skills: optionalSkillsArraySchema.transform((value) => value ?? undefined),
    durationWeeks: z
      .any()
      .transform((value, ctx) => parseOptionalPositiveInteger(value, ctx, { fieldName: 'durationWeeks', max: 520 }))
      .optional(),
    status: projectStatusSchema,
    lifecycleState: lifecycleStateSchema,
    startDate: optionalDateString,
    dueDate: optionalDateString,
    budgetCurrency: optionalIsoCurrencySchema,
    budgetAllocated: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
    autoMatch: autoMatchSettingsSchema,
  })
  .strip();

export const autoMatchSettingsBodySchema = autoMatchSettingsSchema;

export const autoMatchFreelancerBodySchema = autoMatchFreelancerCreateSchema;

export const autoMatchFreelancerUpdateBodySchema = autoMatchFreelancerUpdateSchema;

export const projectIdParamsSchema = z
  .object({
    projectId: z
      .any()
      .transform((value, ctx) => toPositiveInteger(value, ctx, { fieldName: 'projectId' })),
  })
  .strip();

export const autoMatchFreelancerParamsSchema = z
  .object({
    projectId: z
      .any()
      .transform((value, ctx) => toPositiveInteger(value, ctx, { fieldName: 'projectId' })),
    freelancerEntryId: z
      .any()
      .transform((value, ctx) => toPositiveInteger(value, ctx, { fieldName: 'freelancerEntryId' })),
  })
  .strip();

export default {
  createProjectBodySchema,
  updateProjectBodySchema,
  autoMatchSettingsBodySchema,
  autoMatchFreelancerBodySchema,
  autoMatchFreelancerUpdateBodySchema,
  projectIdParamsSchema,
  autoMatchFreelancerParamsSchema,
};
