import { z } from 'zod';
import {
  ID_VERIFICATION_STATUSES,
  ID_VERIFICATION_EVENT_TYPES,
} from '../../models/constants/index.js';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const STATUS_VALUES = ID_VERIFICATION_STATUSES.map((status) => status);
const STATUS_LITERALS = z.union(STATUS_VALUES.map((status) => z.literal(status)));
const EVENT_TYPE_LITERALS = z.union(ID_VERIFICATION_EVENT_TYPES.map((value) => z.literal(value)));
const STATUS_SET = new Set(STATUS_VALUES);

const optionalDateString = optionalTrimmedString({ max: 40 });
const optionalMetadataSchema = z
  .union([z.undefined(), z.null(), z.record(z.string(), z.any())])
  .transform((value) => (value == null ? undefined : value));

const statusesQuerySchema = z
  .union([STATUS_LITERALS, z.array(STATUS_LITERALS), z.string(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    const source = Array.isArray(value)
      ? value
      : typeof value === 'string'
      ? value.split(',')
      : [value];
    const normalized = source
      .map((item) => `${item}`.trim().toLowerCase())
      .filter((item) => STATUS_SET.has(item));
    if (!normalized.length) {
      return undefined;
    }
    return Array.from(new Set(normalized));
  });

const sortBySchema = z
  .union(['submittedAt', 'status', 'reviewer', 'provider'].map((value) => z.literal(value)))
  .optional();

const sortDirectionSchema = z
  .union([z.literal('asc'), z.literal('ASC'), z.literal('desc'), z.literal('DESC')])
  .optional()
  .transform((value) => (value ? value.toUpperCase() : undefined));

export const identityVerificationOverviewQuerySchema = z
  .object({
    lookbackDays: optionalNumber({ min: 1, max: 365, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const identityVerificationListQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
    statuses: statusesQuerySchema,
    provider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    reviewerId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    submittedFrom: optionalDateString.transform((value) => value ?? undefined),
    submittedTo: optionalDateString.transform((value) => value ?? undefined),
    sortBy: sortBySchema,
    sortDirection: sortDirectionSchema,
  })
  .strip();

const statusBodySchema = optionalTrimmedString({ max: 60 }).transform((value) =>
  value ? value.toLowerCase() : undefined,
);

export const identityVerificationCreateSchema = z
  .object({
    userId: z.coerce.number().int().positive({ message: 'userId must be a positive integer.' }),
    profileId: z.coerce.number().int().positive({ message: 'profileId must be a positive integer.' }),
    fullName: requiredTrimmedString({ max: 255 }),
    dateOfBirth: requiredTrimmedString({ max: 40 }),
    verificationProvider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    typeOfId: optionalTrimmedString({ max: 120 }),
    idNumberLast4: optionalTrimmedString({ max: 16 }),
    issuingCountry: optionalTrimmedString({ max: 4, toUpperCase: true }),
    issuedAt: optionalDateString,
    expiresAt: optionalDateString,
    documentFrontKey: optionalTrimmedString({ max: 500 }),
    documentBackKey: optionalTrimmedString({ max: 500 }),
    selfieKey: optionalTrimmedString({ max: 500 }),
    addressLine1: requiredTrimmedString({ max: 255 }),
    addressLine2: optionalTrimmedString({ max: 255 }),
    city: requiredTrimmedString({ max: 120 }),
    state: optionalTrimmedString({ max: 120 }),
    postalCode: requiredTrimmedString({ max: 40 }),
    country: requiredTrimmedString({ max: 4, toUpperCase: true }),
    status: statusBodySchema.refine(
      (value) => !value || STATUS_SET.has(value),
      { message: `status must be one of: ${STATUS_VALUES.join(', ')}.` },
    ),
    reviewNotes: optionalTrimmedString({ max: 2000 }),
    declinedReason: optionalTrimmedString({ max: 2000 }),
    reviewerId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    submittedAt: optionalDateString,
    reviewedAt: optionalDateString,
    metadata: optionalMetadataSchema,
    initialNote: optionalTrimmedString({ max: 2000 }),
    eventMetadata: optionalMetadataSchema,
  })
  .strip();

export const identityVerificationUpdateSchema = z
  .object({
    status: statusBodySchema.refine((value) => !value || STATUS_SET.has(value), {
      message: `status must be one of: ${STATUS_VALUES.join(', ')}.`,
    }),
    reviewerId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    reviewNotes: optionalTrimmedString({ max: 2000 }),
    declinedReason: optionalTrimmedString({ max: 2000 }),
    typeOfId: optionalTrimmedString({ max: 120 }),
    idNumberLast4: optionalTrimmedString({ max: 16 }),
    documentFrontKey: optionalTrimmedString({ max: 500 }),
    documentBackKey: optionalTrimmedString({ max: 500 }),
    selfieKey: optionalTrimmedString({ max: 500 }),
    issuingCountry: optionalTrimmedString({ max: 4, toUpperCase: true }),
    issuedAt: optionalDateString,
    expiresAt: optionalDateString,
    submittedAt: optionalDateString,
    reviewedAt: optionalDateString,
    fullName: optionalTrimmedString({ max: 255 }),
    addressLine1: optionalTrimmedString({ max: 255 }),
    addressLine2: optionalTrimmedString({ max: 255 }),
    city: optionalTrimmedString({ max: 120 }),
    state: optionalTrimmedString({ max: 120 }),
    postalCode: optionalTrimmedString({ max: 40 }),
    country: optionalTrimmedString({ max: 4, toUpperCase: true }),
    metadata: optionalMetadataSchema,
    note: optionalTrimmedString({ max: 2000 }),
    statusNote: optionalTrimmedString({ max: 2000 }),
    documentRequest: z
      .object({
        note: optionalTrimmedString({ max: 2000 }),
        metadata: optionalMetadataSchema,
      })
      .strip()
      .optional(),
    escalate: z
      .object({
        note: optionalTrimmedString({ max: 2000 }),
        metadata: optionalMetadataSchema,
      })
      .strip()
      .optional(),
  })
  .strip();

export const identityVerificationEventBodySchema = z
  .object({
    eventType: EVENT_TYPE_LITERALS,
    note: optionalTrimmedString({ max: 2000 }),
    metadata: optionalMetadataSchema,
    fromStatus: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    toStatus: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
  })
  .strip();

const providerSettingsSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    name: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    enabled: optionalBoolean(),
    webhookUrl: optionalTrimmedString({ max: 500 }),
    apiKey: optionalTrimmedString({ max: 255 }),
    apiSecret: optionalTrimmedString({ max: 255 }),
    sandbox: optionalBoolean(),
    riskPolicy: optionalTrimmedString({ max: 120 }),
    allowedDocuments: optionalStringArray({ maxItemLength: 120 }),
  })
  .strip();

const automationSettingsSchema = z
  .object({
    autoAssignOldest: optionalBoolean(),
    autoRejectExpired: optionalBoolean(),
    autoApproveLowRisk: optionalBoolean(),
    escalationHours: optionalNumber({ min: 1, max: 240, precision: 0, integer: true }).transform((value) => value ?? undefined),
    reminderHours: optionalNumber({ min: 1, max: 240, precision: 0, integer: true }).transform((value) => value ?? undefined),
    riskTolerance: optionalNumber({ min: 0, max: 1, precision: 2 }).transform((value) => value ?? undefined),
    notifyChannel: optionalTrimmedString({ max: 120 }),
  })
  .strip();

const documentsSettingsSchema = z
  .object({
    individual: optionalStringArray({ maxItemLength: 120 }),
    business: optionalStringArray({ maxItemLength: 120 }),
    additionalNotes: optionalTrimmedString({ max: 1000 }),
  })
  .strip();

const storageSettingsSchema = z
  .object({
    evidenceBucket: optionalTrimmedString({ max: 120 }),
    publicBaseUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

export const identityVerificationSettingsSchema = z
  .object({
    providers: z.array(providerSettingsSchema).optional(),
    automation: automationSettingsSchema.optional(),
    documents: documentsSettingsSchema.optional(),
    storage: storageSettingsSchema.optional(),
  })
  .strip();

export default {
  identityVerificationOverviewQuerySchema,
  identityVerificationListQuerySchema,
  identityVerificationCreateSchema,
  identityVerificationUpdateSchema,
  identityVerificationEventBodySchema,
  identityVerificationSettingsSchema,
};
