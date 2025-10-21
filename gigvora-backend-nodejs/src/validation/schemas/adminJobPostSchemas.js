import { z } from 'zod';
import {
  optionalBoolean,
  optionalGeoLocation,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const STATUS_OPTIONS = ['draft', 'pending_review', 'approved', 'published', 'paused', 'archived'];
const VISIBILITY_OPTIONS = ['public', 'internal', 'private'];
const WORKFLOW_OPTIONS = ['draft', 'review', 'approved', 'active', 'archived'];
const APPROVAL_OPTIONS = ['pending_review', 'changes_requested', 'approved', 'rejected'];
const WORKPLACE_OPTIONS = ['remote', 'hybrid', 'onsite', 'flex'];
const CONTRACT_OPTIONS = ['full_time', 'part_time', 'contract', 'temporary', 'internship'];
const COMPENSATION_OPTIONS = ['salary', 'hourly', 'daily', 'project', 'equity', 'stipend'];
const EXPERIENCE_OPTIONS = ['entry', 'mid', 'senior', 'lead', 'executive'];

const optionalEnum = (values, field) =>
  optionalTrimmedString({ max: 60 })
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
          message: `${field ?? 'value'} must be one of: ${values.join(', ')}.`,
        });
      }
    });

const optionalIsoDateTime = (field) =>
  optionalTrimmedString({ max: 64 })
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
      if (value == null) {
        return;
      }
      if (Number.isNaN(new Date(value).getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} must be a valid ISO-8601 date/time.`,
        });
      }
    });

const optionalUrl = z
  .union([
    z.undefined(),
    z
      .string()
      .trim()
      .min(1)
      .max(2048)
      .transform((value) => (value.startsWith('http') ? value : `https://${value}`))
      .refine((value) => {
        try {
          // eslint-disable-next-line no-new
          new URL(value);
          return true;
        } catch (error) {
          return false;
        }
      }, { message: 'must be a valid URL.' }),
  ])
  .transform((value) => value ?? undefined);

const optionalEmail = z
  .union([
    z.undefined(),
    z
      .string()
      .trim()
      .min(1)
      .max(255)
      .email('must be a valid email address.')
      .transform((value) => value.toLowerCase()),
  ])
  .transform((value) => value ?? undefined);

const attachmentSchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }),
    url: requiredTrimmedString({ max: 2048 }).transform((value) => (value.startsWith('http') ? value : `https://${value}`)),
    type: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
  })
  .strip();

const textListSchema = z
  .union([
    z.undefined(),
    requiredTrimmedString({ max: 5000 }),
    z.array(requiredTrimmedString({ max: 500 })),
  ])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 50);
    }
    return value
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 50);
  });

const jobPostSharedShape = {
  location: optionalTrimmedString({ max: 255 }),
  employmentType: optionalTrimmedString({ max: 120 }),
  geoLocation: optionalGeoLocation(),
  slug: optionalTrimmedString({ max: 160 }).transform((value) => value?.toLowerCase()),
  status: optionalEnum(STATUS_OPTIONS, 'status'),
  visibility: optionalEnum(VISIBILITY_OPTIONS, 'visibility'),
  workflowStage: optionalEnum(WORKFLOW_OPTIONS, 'workflowStage'),
  approvalStatus: optionalEnum(APPROVAL_OPTIONS, 'approvalStatus'),
  approvalNotes: optionalTrimmedString({ max: 1000 }),
  applicationUrl: optionalUrl,
  applicationEmail: optionalEmail,
  applicationInstructions: optionalTrimmedString({ max: 5000 }),
  salaryMin: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
  salaryMax: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
  currency: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
  compensationType: optionalEnum(COMPENSATION_OPTIONS, 'compensationType'),
  workplaceType: optionalEnum(WORKPLACE_OPTIONS, 'workplaceType'),
  contractType: optionalEnum(CONTRACT_OPTIONS, 'contractType'),
  experienceLevel: optionalEnum(EXPERIENCE_OPTIONS, 'experienceLevel'),
  department: optionalTrimmedString({ max: 120 }),
  team: optionalTrimmedString({ max: 120 }),
  hiringManagerName: optionalTrimmedString({ max: 120 }),
  hiringManagerEmail: optionalEmail,
  recruiterName: optionalTrimmedString({ max: 120 }),
  recruiterEmail: optionalEmail,
  tags: optionalStringArray({ maxItemLength: 120, maxLength: 50 }),
  benefits: textListSchema,
  responsibilities: textListSchema,
  requirements: textListSchema,
  attachments: z.array(attachmentSchema).optional(),
  promotionFlags: z
    .object({
      featured: optionalBoolean(),
      highlighted: optionalBoolean(),
      newsletter: optionalBoolean(),
      pushNotification: optionalBoolean(),
    })
    .strip()
    .optional(),
  metadata: z.record(z.any()).optional(),
  publishedAt: optionalIsoDateTime('publishedAt'),
  expiresAt: optionalIsoDateTime('expiresAt'),
  archivedAt: optionalIsoDateTime('archivedAt'),
  archiveReason: optionalTrimmedString({ max: 255 }),
  externalReference: optionalTrimmedString({ max: 120 }),
};

const buildJobPostSchema = (titleSchema, descriptionSchema) =>
  z
    .object({
      title: titleSchema,
      description: descriptionSchema,
      ...jobPostSharedShape,
    })
    .strip();

const applyJobPostRefinements = (schema) =>
  schema.superRefine((value, ctx) => {
    if (value.salaryMin != null && value.salaryMax != null && value.salaryMin > value.salaryMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'salaryMin must be less than or equal to salaryMax.',
        path: ['salaryMin'],
      });
    }
    if (value.publishedAt && value.expiresAt && value.publishedAt > value.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'publishedAt must be before expiresAt.',
        path: ['publishedAt'],
      });
    }
  });

const jobPostBaseSchema = applyJobPostRefinements(
  buildJobPostSchema(requiredTrimmedString({ max: 255, min: 4 }), requiredTrimmedString({ max: 20000, min: 10 })),
);

export const adminJobPostListQuerySchema = z
  .object({
    status: optionalEnum(STATUS_OPTIONS, 'status'),
    workflowStage: optionalEnum(WORKFLOW_OPTIONS, 'workflowStage'),
    visibility: optionalEnum(VISIBILITY_OPTIONS, 'visibility'),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    page: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminJobPostCreateSchema = jobPostBaseSchema;

export const adminJobPostUpdateSchema = applyJobPostRefinements(
  buildJobPostSchema(optionalTrimmedString({ max: 255 }), optionalTrimmedString({ max: 20000 })),
);

export const adminJobPostLifecycleSchema = z
  .object({
    publishedAt: optionalIsoDateTime('publishedAt'),
  })
  .strip();

export const adminJobPostArchiveSchema = z
  .object({
    reason: optionalTrimmedString({ max: 255 }),
  })
  .strip();
