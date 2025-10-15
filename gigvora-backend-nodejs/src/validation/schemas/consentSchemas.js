import { z } from 'zod';
import { optionalBoolean, optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';

const metadataSchema = z
  .union([z.record(z.string(), z.any()), z.undefined()])
  .transform((value) => value ?? {});

const optionalLongText = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    return `${value}`;
  });

export const consentPolicyQuerySchema = z
  .object({
    audience: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    region: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    includeInactive: optionalBoolean(),
  })
  .strip();

const consentPolicyVersionSchema = z
  .object({
    version: optionalNumber({ min: 1, max: 999, precision: 0, integer: true }).transform((value) => value ?? undefined),
    documentUrl: optionalTrimmedString({ max: 1024 }).transform((value) => value ?? undefined),
    content: optionalLongText,
    summary: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    effectiveAt: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
    createdBy: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

export const createConsentPolicyBodySchema = z
  .object({
    code: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    title: requiredTrimmedString({ max: 240 }),
    description: optionalLongText,
    audience: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    region: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    legalBasis: requiredTrimmedString({ max: 80 }),
    required: optionalBoolean(),
    revocable: optionalBoolean(),
    retentionPeriodDays: optionalNumber({ min: 1, max: 3650, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    metadata: metadataSchema,
    version: consentPolicyVersionSchema.optional(),
  })
  .strip();

export const updateConsentPolicyBodySchema = z
  .object({
    title: optionalTrimmedString({ max: 240 }).transform((value) => value ?? undefined),
    description: optionalLongText,
    audience: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    region: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    legalBasis: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    required: optionalBoolean(),
    revocable: optionalBoolean(),
    retentionPeriodDays: optionalNumber({ min: 1, max: 3650, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    metadata: metadataSchema.optional(),
  })
  .strip();

export const createConsentVersionBodySchema = consentPolicyVersionSchema;

export const consentSnapshotQuerySchema = z
  .object({
    audience: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    region: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
  })
  .strip();

export const updateUserConsentBodySchema = z
  .object({
    status: requiredTrimmedString({ max: 20, toLowerCase: true }).refine(
      (value) => value === 'granted' || value === 'withdrawn',
      { message: 'status must be either granted or withdrawn.' },
    ),
    source: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    metadata: metadataSchema.optional(),
  })
  .strip();

export default {
  consentPolicyQuerySchema,
  createConsentPolicyBodySchema,
  updateConsentPolicyBodySchema,
  createConsentVersionBodySchema,
  consentSnapshotQuerySchema,
  updateUserConsentBodySchema,
};
