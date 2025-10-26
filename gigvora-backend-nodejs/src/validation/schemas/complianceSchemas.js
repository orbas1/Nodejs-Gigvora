import { z } from 'zod';

const positiveInteger = z.coerce.number().int().positive();

const optionalTrimmedString = (maxLength) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength);

const nullableTrimmedString = (maxLength) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return value;
    })
    .refine((value) => (value == null ? true : value.length <= maxLength), {
      message: `Must be ${maxLength} characters or fewer.`,
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
      if (!Number.isFinite(value)) {
        return undefined;
      }
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

const frameworksArray = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return [];
    }
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw
      .flatMap((entry) => {
        if (entry == null) {
          return [];
        }
        const fragments = Array.isArray(entry) ? entry : String(entry).split(',');
        return fragments.map((fragment) => fragment.trim()).filter(Boolean);
      })
      .filter(Boolean);
  }, z.array(z.string().min(2).max(80)))
  .max(25)
  .default([]);

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length ? value : undefined));

const tagsArray = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  }, z.array(z.string().min(1).max(120)).optional())
  .transform((value) => (value ? value.map((tag) => tag.trim()).filter(Boolean) : undefined));

const metadataRecord = z.record(z.any()).optional();
const stringArray = z
  .preprocess((value) => {
    if (value == null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return `${value}`
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }, z.array(z.string().min(1).max(120)))
  .optional()
  .transform((value) => value ?? []);

const ID_VERIFICATION_STATUS_VALUES = ['pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired'];

const isoDateString = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Must be a valid ISO date string.' });

const countryCode = z
  .string()
  .trim()
  .min(2)
  .max(4)
  .transform((value) => value.toUpperCase());

const idTypeString = z
  .string()
  .trim()
  .min(2)
  .max(120);

const addressLine = z
  .string()
  .trim()
  .min(1)
  .max(255);

const optionalAddressLine = z
  .string()
  .trim()
  .optional()
  .refine((value) => (value == null ? true : value.length <= 255), {
    message: 'Must be 255 characters or fewer.',
  });

export const identityVerificationQuerySchema = z
  .object({
    userId: positiveInteger,
    profileId: positiveInteger.optional(),
    includeHistory: optionalBoolean.default(true),
    actorRoles: stringArray.default([]),
  })
  .transform((value) => ({
    ...value,
    actorRoles: value.actorRoles ?? [],
  }));

const identityVerificationBaseBody = z
  .object({
    userId: positiveInteger,
    profileId: positiveInteger,
    actorId: positiveInteger.optional(),
    actorRoles: stringArray.default([]),
    status: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .refine((value) => value == null || ID_VERIFICATION_STATUS_VALUES.includes(value), {
        message: 'Invalid identity verification status.',
      }),
    verificationProvider: nullableTrimmedString(80),
    typeOfId: idTypeString,
    idNumberLast4: nullableTrimmedString(16),
    issuingCountry: z.string().trim().max(4).optional().transform((value) => (value ? value.toUpperCase() : undefined)),
    issuedAt: optionalDateString,
    expiresAt: optionalDateString,
    documentFrontKey: nullableTrimmedString(500),
    documentBackKey: nullableTrimmedString(500),
    selfieKey: nullableTrimmedString(500),
    fullName: optionalTrimmedString(255),
    dateOfBirth: isoDateString,
    addressLine1: addressLine,
    addressLine2: optionalAddressLine,
    city: z.string().trim().min(1).max(120),
    state: nullableTrimmedString(120),
    postalCode: z.string().trim().min(1).max(40),
    country: countryCode,
    reviewNotes: nullableTrimmedString(2000),
    declinedReason: nullableTrimmedString(2000),
    submittedAt: optionalDateString,
    reviewedAt: optionalDateString,
    metadata: metadataRecord,
  })
  .passthrough();

export const identityVerificationBodySchema = identityVerificationBaseBody;

export const identityVerificationSubmitBodySchema = identityVerificationBaseBody.extend({
  status: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toLowerCase() : 'submitted'))
    .refine((value) => ID_VERIFICATION_STATUS_VALUES.includes(value), {
      message: 'Invalid identity verification status.',
    }),
  submittedAt: optionalDateString,
});

export const identityVerificationReviewBodySchema = z
  .object({
    userId: positiveInteger,
    profileId: positiveInteger,
    actorId: positiveInteger.optional(),
    actorRoles: stringArray.default([]),
    reviewerId: positiveInteger,
    status: z
      .string()
      .trim()
      .transform((value) => value.toLowerCase())
      .refine((value) => ID_VERIFICATION_STATUS_VALUES.includes(value), {
        message: 'Invalid identity verification status.',
      }),
    reviewNotes: nullableTrimmedString(2000),
    declinedReason: nullableTrimmedString(2000),
    reviewedAt: optionalDateString,
    metadata: metadataRecord,
  })
  .passthrough();

export const identityDocumentUploadSchema = z
  .object({
    actorId: positiveInteger.optional(),
    data: z.string().min(1),
    fileName: optionalTrimmedString(255),
    contentType: optionalTrimmedString(120),
  })
  .passthrough();

export const identityDocumentQuerySchema = z
  .object({
    key: optionalTrimmedString(500),
  })
  .transform((value) => ({
    key: value.key,
  }));

export const complianceLockerQuerySchema = z
  .object({
    userId: positiveInteger,
    limit: z.coerce.number().int().positive().max(250).optional(),
    region: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        return String(value).trim();
      }, z.string().max(80).optional())
      .optional(),
    frameworks: frameworksArray,
    useCache: optionalBoolean,
  })
  .transform((value) => ({
    ...value,
    frameworks: value.frameworks ?? [],
  }));

export const complianceDocumentParamsSchema = z.object({
  documentId: positiveInteger,
});

export const complianceReminderParamsSchema = z.object({
  reminderId: positiveInteger,
});

export const taxReminderParamsSchema = complianceReminderParamsSchema;

export const createComplianceDocumentBodySchema = z
  .object({
    actorId: positiveInteger,
    ownerId: positiveInteger,
    workspaceId: positiveInteger.optional(),
    title: optionalTrimmedString(255),
    documentType: nullableTrimmedString(120),
    status: nullableTrimmedString(120),
    storageProvider: nullableTrimmedString(120),
    storageRegion: nullableTrimmedString(120),
    storagePath: optionalTrimmedString(500),
    counterpartyName: nullableTrimmedString(255),
    counterpartyEmail: nullableTrimmedString(255),
    counterpartyCompany: nullableTrimmedString(255),
    jurisdiction: nullableTrimmedString(120),
    governingLaw: nullableTrimmedString(120),
    effectiveDate: optionalDateString,
    expiryDate: optionalDateString,
    renewalTerms: nullableTrimmedString(255),
    obligationSummary: nullableTrimmedString(500),
    tags: tagsArray,
    metadata: metadataRecord,
    obligations: z.array(z.record(z.any())).optional(),
    reminders: z.array(z.record(z.any())).optional(),
    files: z.array(z.record(z.any())).optional(),
  })
  .passthrough();

export const addComplianceDocumentVersionBodySchema = z
  .object({
    actorId: positiveInteger,
    versionNumber: z.coerce.number().int().positive().optional(),
    fileKey: nullableTrimmedString(500),
    storageKey: nullableTrimmedString(500),
    fileName: optionalTrimmedString(255),
    mimeType: nullableTrimmedString(120),
    fileSize: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      }, z.number().min(0).optional()),
    sha256: nullableTrimmedString(128),
    signedAt: optionalDateString,
    signedByName: nullableTrimmedString(255),
    signedByEmail: nullableTrimmedString(255),
    signedByIp: nullableTrimmedString(64),
    changeSummary: nullableTrimmedString(500),
    metadata: metadataRecord,
    auditTrail: metadataRecord,
    status: nullableTrimmedString(120),
    effectiveDate: optionalDateString,
    expiryDate: optionalDateString,
    renewalTerms: nullableTrimmedString(255),
  })
  .refine((value) => value.fileKey || value.storageKey, {
    message: 'fileKey or storageKey is required.',
    path: ['fileKey'],
  })
  .passthrough();

const VALID_REMINDER_STATUSES = new Set(['scheduled', 'sent', 'acknowledged', 'dismissed', 'cancelled']);

export const acknowledgeReminderBodySchema = z
  .object({
    actorId: positiveInteger.optional(),
    status: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .refine((value) => value == null || VALID_REMINDER_STATUSES.has(value), {
        message: 'Invalid reminder status.',
      }),
  })
  .passthrough();

export const taxDocumentsQuerySchema = z
  .object({
    freelancerId: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        return Number(value);
      }, positiveInteger.optional())
      .optional(),
    lookbackYears: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      }, z.number().int().min(1).max(5).optional())
      .optional(),
  })
  .transform((value) => ({
    freelancerId: value.freelancerId,
    lookbackYears: value.lookbackYears,
  }));

export const taxDocumentParamsSchema = z.object({
  filingId: positiveInteger,
});

export const taxDocumentAcknowledgeBodySchema = z
  .object({
    actorId: positiveInteger.optional(),
  })
  .passthrough();

export const taxDocumentUploadBodySchema = z
  .object({
    data: z.string().min(1),
    fileName: optionalTrimmedString(255),
    contentType: optionalTrimmedString(120),
    actorId: positiveInteger.optional(),
    workspaceId: positiveInteger.optional(),
    storageProvider: nullableTrimmedString(120),
    storageRegion: nullableTrimmedString(120),
    sha256: nullableTrimmedString(128),
  })
  .refine((value) => value.fileName && value.contentType, {
    message: 'fileName and contentType are required.',
  })
  .passthrough();

export const taxReminderSnoozeBodySchema = z
  .object({
    days: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      }, z.number().int().min(1).max(60).optional())
      .optional(),
  })
  .passthrough();

export const complianceAuditLogQuerySchema = z
  .object({
    workspaceId: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        return Number(value);
      }, positiveInteger.optional())
      .optional(),
    status: z
      .preprocess((value) => {
        if (value == null) {
          return [];
        }
        return Array.isArray(value) ? value : [value];
      }, z.array(optionalTrimmedString(80)).optional())
      .optional(),
    severity: z
      .preprocess((value) => {
        if (value == null) {
          return [];
        }
        return Array.isArray(value) ? value : [value];
      }, z.array(optionalTrimmedString(40)).optional())
      .optional(),
    search: optionalTrimmedString(200),
    limit: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      }, z.number().int().min(1).max(500).optional())
      .optional(),
    since: optionalDateString,
  })
  .transform((value) => ({
    workspaceId: value.workspaceId,
    status: (value.status ?? []).filter(Boolean).map((entry) => entry.toLowerCase()),
    severity: (value.severity ?? []).filter(Boolean).map((entry) => entry.toLowerCase()),
    search: value.search ?? undefined,
    limit: value.limit ?? undefined,
    since: value.since ?? undefined,
  }));

export default {
  complianceLockerQuerySchema,
  complianceDocumentParamsSchema,
  complianceReminderParamsSchema,
  createComplianceDocumentBodySchema,
  addComplianceDocumentVersionBodySchema,
  taxDocumentsQuerySchema,
  taxDocumentParamsSchema,
  taxDocumentAcknowledgeBodySchema,
  taxDocumentUploadBodySchema,
  taxReminderParamsSchema,
  taxReminderSnoozeBodySchema,
  complianceAuditLogQuerySchema,
  acknowledgeReminderBodySchema,
};
