import { z } from 'zod';
import {
  LEGAL_DOCUMENT_CATEGORIES,
  LEGAL_DOCUMENT_STATUSES,
  LEGAL_DOCUMENT_VERSION_STATUSES,
} from '../../models/constants/index.js';

const slugPattern = /^[a-z0-9][a-z0-9_-]{1,119}$/i;
const localeSchema = z.string().trim().min(2).max(12);

const metadataSchema = z.record(z.any()).optional();

const stringArraySchema = z.array(z.string().trim().min(2).max(80)).optional();

const tagArraySchema = z.array(z.string().trim().min(2).max(60)).optional();

const versionStatusSchema = z.enum(LEGAL_DOCUMENT_VERSION_STATUSES);

export const legalDocumentQuerySchema = z
  .object({
    category: z.enum(LEGAL_DOCUMENT_CATEGORIES).optional(),
    status: z.enum(LEGAL_DOCUMENT_STATUSES).optional(),
    locale: localeSchema.optional(),
    includeVersions: z.enum(['true', 'false']).optional(),
  })
  .strip();

export const legalDocumentSlugParamSchema = z
  .object({ slug: z.string().trim().min(2).max(120) })
  .strip();

export const legalDocumentIdParamSchema = z
  .object({ documentId: z.coerce.number().int().positive({ message: 'documentId must be a positive integer.' }) })
  .strip();

export const legalDocumentVersionParamSchema = z
  .object({
    documentId: z.coerce.number().int().positive(),
    versionId: z.coerce.number().int().positive(),
  })
  .strip();

const baseDocumentSchema = z.object({
  title: z.string().trim().min(3).max(240),
  slug: z
    .string()
    .trim()
    .regex(slugPattern, 'slug must contain only letters, numbers, dashes, or underscores and be at least 2 characters.')
    .optional(),
  category: z.enum(LEGAL_DOCUMENT_CATEGORIES),
  status: z.enum(LEGAL_DOCUMENT_STATUSES).optional(),
  region: z.string().trim().min(2).max(60).optional(),
  defaultLocale: localeSchema.optional(),
  audienceRoles: stringArraySchema,
  editorRoles: stringArraySchema,
  tags: tagArraySchema,
  summary: z.string().trim().max(4000).nullish(),
  metadata: metadataSchema,
});

const baseVersionSchema = z.object({
  locale: localeSchema.optional(),
  version: z.coerce.number().int().positive().optional(),
  status: versionStatusSchema.optional(),
  effectiveAt: z.string().datetime().optional(),
  summary: z.string().trim().max(4000).nullish(),
  changeSummary: z.string().trim().max(4000).nullish(),
  content: z.string().nullish(),
  externalUrl: z.string().url().nullish(),
  metadata: metadataSchema,
});

export const createLegalDocumentBodySchema = baseDocumentSchema.extend({
  initialVersion: baseVersionSchema.optional(),
});

export const updateLegalDocumentBodySchema = baseDocumentSchema.partial();

export const createLegalDocumentVersionBodySchema = baseVersionSchema.extend({
  locale: localeSchema,
});

export const updateLegalDocumentVersionBodySchema = baseVersionSchema;

export const publishLegalDocumentVersionBodySchema = z
  .object({
    effectiveAt: z.string().datetime().optional(),
    summary: z.string().trim().max(4000).nullish(),
    changeSummary: z.string().trim().max(4000).nullish(),
  })
  .strip();

export const archiveLegalDocumentVersionBodySchema = z
  .object({
    archivedAt: z.string().datetime().optional(),
    reason: z.string().trim().max(4000).nullish(),
  })
  .strip();

export const legalDocumentDetailQuerySchema = z
  .object({
    includeVersions: z.enum(['true', 'false']).optional(),
    includeAudit: z.enum(['true', 'false']).optional(),
  })
  .strip();

export default {
  legalDocumentQuerySchema,
  legalDocumentSlugParamSchema,
  legalDocumentIdParamSchema,
  legalDocumentVersionParamSchema,
  createLegalDocumentBodySchema,
  updateLegalDocumentBodySchema,
  createLegalDocumentVersionBodySchema,
  updateLegalDocumentVersionBodySchema,
  publishLegalDocumentVersionBodySchema,
  archiveLegalDocumentVersionBodySchema,
  legalDocumentDetailQuerySchema,
};
