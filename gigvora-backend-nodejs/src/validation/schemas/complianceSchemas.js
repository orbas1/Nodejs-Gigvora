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

export default {
  complianceLockerQuerySchema,
  complianceDocumentParamsSchema,
  complianceReminderParamsSchema,
  createComplianceDocumentBodySchema,
  addComplianceDocumentVersionBodySchema,
  acknowledgeReminderBodySchema,
};
