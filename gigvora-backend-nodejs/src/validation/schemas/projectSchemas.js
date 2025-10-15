import { z } from 'zod';
import {
  optionalBoolean,
  optionalGeoLocation,
  optionalNumber,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

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

const actorIdSchema = optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined);

const budgetAmountSchema = optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined);

const budgetCurrencySchema = optionalTrimmedString({ max: 3, toUpperCase: true })
  .transform((value) => value ?? undefined)
  .superRefine((value, ctx) => {
    if (value && !/^[A-Z]{3}$/.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'budgetCurrency must be a valid ISO-4217 code.' });
    }
  });

const fairnessSchema = z
  .object({
    ensureNewcomer: optionalBoolean(),
    maxAssignments: optionalNumber({ min: 0, max: 1000, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip()
  .optional()
  .transform((value) => pruneUndefined(value));

const weightsSchema = z
  .record(z.union([z.string(), z.number()]))
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    const cleaned = Object.entries(value).reduce((accumulator, [key, raw]) => {
      const numeric = Number(raw);
      if (Number.isFinite(numeric) && numeric >= 0) {
        accumulator[key] = Number(numeric.toFixed(6));
      }
      return accumulator;
    }, {});
    return Object.keys(cleaned).length ? cleaned : undefined;
  });

const autoAssignSettingsSchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
    expiresInMinutes: optionalNumber({ min: 30, max: 1440, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    fairness: fairnessSchema,
    weights: weightsSchema,
  })
  .strip()
  .optional()
  .transform((value) => pruneUndefined(value));

const autoAssignConfigSchema = z
  .object({
    enabled: optionalBoolean(),
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
    expiresInMinutes: optionalNumber({ min: 30, max: 1440, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    fairness: fairnessSchema,
    weights: weightsSchema,
    regenerateQueue: optionalBoolean(),
    settings: autoAssignSettingsSchema,
  })
  .strip()
  .optional()
  .transform((value) => pruneUndefined(value));

const projectBaseSchema = z
  .object({
    actorId: actorIdSchema,
    title: requiredTrimmedString({ min: 3, max: 180 }),
    description: requiredTrimmedString({ min: 10, max: 10000 }),
    status: optionalTrimmedString({ max: 120 }).transform((value) => value?.toLowerCase()),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    geoLocation: optionalGeoLocation(),
    budgetAmount: budgetAmountSchema,
    budgetCurrency: budgetCurrencySchema,
    autoAssign: autoAssignConfigSchema,
  })
  .strip();

export const createProjectBodySchema = projectBaseSchema;

export const updateProjectBodySchema = z
  .object({
    actorId: actorIdSchema,
    title: optionalTrimmedString({ max: 180 }),
    description: optionalTrimmedString({ max: 10000 }),
    status: optionalTrimmedString({ max: 120 }).transform((value) => value?.toLowerCase()),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    geoLocation: optionalGeoLocation(),
    budgetAmount: budgetAmountSchema,
    budgetCurrency: budgetCurrencySchema,
    autoAssign: autoAssignConfigSchema,
  })
  .strip();

export const projectIdParamsSchema = z
  .object({
    projectId: z
      .any()
      .transform((value, ctx) => toPositiveInteger(value, ctx, { fieldName: 'projectId' })),
  })
  .strip();

export const projectEventsQuerySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const projectAutoAssignBodySchema = z
  .object({
    actorId: actorIdSchema,
    enabled: optionalBoolean(),
    budgetAmount: budgetAmountSchema,
    settings: autoAssignSettingsSchema,
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
    expiresInMinutes: optionalNumber({ min: 30, max: 1440, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    fairness: fairnessSchema,
    weights: weightsSchema,
    regenerateQueue: optionalBoolean(),
  })
  .strip()
  .transform((value) => {
    const mergedSettings = pruneUndefined({
      limit: value.limit,
      expiresInMinutes: value.expiresInMinutes,
      fairness: value.fairness,
      weights: value.weights,
    });

    const payload = {
      actorId: value.actorId,
      enabled: value.enabled,
      budgetAmount: value.budgetAmount,
      settings: value.settings ?? mergedSettings,
      regenerateQueue: value.regenerateQueue,
    };

    return pruneUndefined(payload) ?? {};
  });

export default {
  createProjectBodySchema,
  updateProjectBodySchema,
  projectIdParamsSchema,
  projectEventsQuerySchema,
  projectAutoAssignBodySchema,
};
