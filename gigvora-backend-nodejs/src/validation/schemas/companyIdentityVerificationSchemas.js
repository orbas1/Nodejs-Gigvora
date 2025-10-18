import { z } from 'zod';
import { ID_VERIFICATION_STATUSES } from '../../models/index.js';

const positiveInteger = z.coerce.number().int().positive();

const requiredTrimmedString = (maxLength, { min = 1 } = {}) =>
  z
    .string({ invalid_type_error: 'Must be a string.' })
    .trim()
    .min(min)
    .max(maxLength);

const optionalTrimmedString = (maxLength) =>
  z
    .string({ invalid_type_error: 'Must be a string.' })
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return value;
    });

const optionalBoolean = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalised = value.trim().toLowerCase();
      if (!normalised) {
        return undefined;
      }
      if (['true', '1', 'yes', 'on'].includes(normalised)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalised)) {
        return false;
      }
    }
    return undefined;
  }, z.boolean().optional());

const optionalDateString = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const candidate = new Date(value);
    if (Number.isNaN(candidate.getTime())) {
      throw new Error('Invalid date value.');
    }
    return candidate.toISOString();
  }, z.string().optional())
  .optional();

const metadataSchema = z.record(z.any()).optional();

const statusEnum = z.enum([...ID_VERIFICATION_STATUSES]);

export const identityVerificationListQuerySchema = z
  .object({
    workspaceId: positiveInteger.optional(),
    status: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        const source = Array.isArray(value) ? value : `${value}`.split(',');
        return source.map((entry) => `${entry}`.trim()).filter(Boolean);
      }, z.array(statusEnum).optional())
      .transform((value) => (value ? Array.from(new Set(value)) : undefined)),
    search: optionalTrimmedString(120),
    page: positiveInteger.optional(),
    pageSize: positiveInteger.optional(),
    sort: optionalTrimmedString(40),
    includeMembers: optionalBoolean,
  })
  .passthrough();

export const identityVerificationParamsSchema = z.object({
  verificationId: positiveInteger,
});

export const identityVerificationDetailQuerySchema = z
  .object({
    workspaceId: positiveInteger.optional(),
  })
  .passthrough();

export const identityVerificationCreateSchema = z
  .object({
    workspaceId: positiveInteger,
    actorId: positiveInteger.optional(),
    userId: positiveInteger,
    profileId: positiveInteger.optional(),
    status: statusEnum.optional(),
    verificationProvider: optionalTrimmedString(80),
    typeOfId: requiredTrimmedString(120, { min: 2 }),
    idNumberLast4: optionalTrimmedString(16),
    issuingCountry: optionalTrimmedString(4),
    issuedAt: optionalDateString,
    expiresAt: optionalDateString,
    documentFrontKey: optionalTrimmedString(500),
    documentBackKey: optionalTrimmedString(500),
    selfieKey: optionalTrimmedString(500),
    fullName: requiredTrimmedString(255, { min: 2 }),
    dateOfBirth: requiredTrimmedString(32, { min: 4 }),
    addressLine1: requiredTrimmedString(255, { min: 2 }),
    addressLine2: optionalTrimmedString(255),
    city: requiredTrimmedString(120, { min: 2 }),
    state: optionalTrimmedString(120),
    postalCode: requiredTrimmedString(40, { min: 2 }),
    country: requiredTrimmedString(4, { min: 2 }),
    reviewNotes: optionalTrimmedString(2000),
    declinedReason: optionalTrimmedString(2000),
    reviewerId: positiveInteger.optional().nullable(),
    submittedAt: optionalDateString,
    reviewedAt: optionalDateString,
    metadata: metadataSchema,
    notes: optionalTrimmedString(2000),
  })
  .transform((value) => ({
    ...value,
    reviewerId: value.reviewerId ?? undefined,
  }));

export const identityVerificationUpdateSchema = z
  .object({
    workspaceId: positiveInteger,
    actorId: positiveInteger.optional(),
    status: statusEnum.optional(),
    reviewNotes: optionalTrimmedString(2000),
    declinedReason: optionalTrimmedString(2000),
    reviewerId: positiveInteger.optional().nullable(),
    verificationProvider: optionalTrimmedString(80),
    typeOfId: optionalTrimmedString(120),
    idNumberLast4: optionalTrimmedString(16),
    issuingCountry: optionalTrimmedString(4),
    issuedAt: optionalDateString,
    expiresAt: optionalDateString,
    documentFrontKey: optionalTrimmedString(500),
    documentBackKey: optionalTrimmedString(500),
    selfieKey: optionalTrimmedString(500),
    fullName: optionalTrimmedString(255),
    dateOfBirth: optionalTrimmedString(32),
    addressLine1: optionalTrimmedString(255),
    addressLine2: optionalTrimmedString(255),
    city: optionalTrimmedString(120),
    state: optionalTrimmedString(120),
    postalCode: optionalTrimmedString(40),
    country: optionalTrimmedString(4),
    metadata: metadataSchema,
    statusNotes: optionalTrimmedString(2000),
    submittedAt: optionalDateString,
    reviewedAt: optionalDateString,
  })
  .transform((value) => ({
    ...value,
    reviewerId: value.reviewerId === null ? null : value.reviewerId ?? undefined,
  }));

export default {
  identityVerificationListQuerySchema,
  identityVerificationParamsSchema,
  identityVerificationDetailQuerySchema,
  identityVerificationCreateSchema,
  identityVerificationUpdateSchema,
};
