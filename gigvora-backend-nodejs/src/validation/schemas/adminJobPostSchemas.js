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

function optionalEnum(values) {
  return z
    .union([
      z.undefined(),
      z
        .string()
        .trim()
        .min(1)
        .transform((value) => value.toLowerCase())
        .refine((value) => values.includes(value), {
          message: `must be one of: ${values.join(', ')}`,
        }),
    ])
    .transform((value) => value ?? undefined);
}

const attachmentSchema = z
  .object({
    label: optionalTrimmedString({ max: 120 }),
    url: requiredTrimmedString({ max: 2048 }),
    type: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
  })
  .strip();

const textListSchema = z
  .union([
    requiredTrimmedString({ max: 5000 }),
    z.array(requiredTrimmedString({ max: 500 })),
  ])
  .optional();

const jobPostBaseSchema = z
  .object({
    title: requiredTrimmedString({ max: 255, min: 4 }),
    description: requiredTrimmedString({ max: 20000, min: 10 }),
    location: optionalTrimmedString({ max: 255 }),
    employmentType: optionalTrimmedString({ max: 120 }),
    geoLocation: optionalGeoLocation(),
    slug: optionalTrimmedString({ max: 160 }).transform((value) => value?.toLowerCase()),
    status: optionalEnum(STATUS_OPTIONS),
    visibility: optionalEnum(VISIBILITY_OPTIONS),
    workflowStage: optionalEnum(WORKFLOW_OPTIONS),
    approvalStatus: optionalEnum(APPROVAL_OPTIONS),
    approvalNotes: optionalTrimmedString({ max: 1000 }),
    applicationUrl: optionalTrimmedString({ max: 2048 }),
    applicationEmail: optionalTrimmedString({ max: 255 }),
    applicationInstructions: optionalTrimmedString({ max: 5000 }),
    salaryMin: optionalNumber({ min: 0, precision: 2 }),
    salaryMax: optionalNumber({ min: 0, precision: 2 }),
    currency: optionalTrimmedString({ max: 3, toUpperCase: true }),
    compensationType: optionalEnum(COMPENSATION_OPTIONS),
    workplaceType: optionalEnum(WORKPLACE_OPTIONS),
    contractType: optionalEnum(CONTRACT_OPTIONS),
    experienceLevel: optionalEnum(EXPERIENCE_OPTIONS),
    department: optionalTrimmedString({ max: 120 }),
    team: optionalTrimmedString({ max: 120 }),
    hiringManagerName: optionalTrimmedString({ max: 120 }),
    hiringManagerEmail: optionalTrimmedString({ max: 255 }),
    recruiterName: optionalTrimmedString({ max: 120 }),
    recruiterEmail: optionalTrimmedString({ max: 255 }),
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
    publishedAt: optionalTrimmedString({ max: 64 }),
    expiresAt: optionalTrimmedString({ max: 64 }),
    archivedAt: optionalTrimmedString({ max: 64 }),
    archiveReason: optionalTrimmedString({ max: 255 }),
    externalReference: optionalTrimmedString({ max: 120 }),
  })
  .strip();

export const adminJobPostListQuerySchema = z
  .object({
    status: optionalEnum(STATUS_OPTIONS),
    workflowStage: optionalEnum(WORKFLOW_OPTIONS),
    visibility: optionalEnum(VISIBILITY_OPTIONS),
    search: optionalTrimmedString({ max: 255 }),
    page: optionalNumber({ min: 1, precision: 0, integer: true }),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
  })
  .strip();

export const adminJobPostCreateSchema = jobPostBaseSchema;

export const adminJobPostUpdateSchema = jobPostBaseSchema.partial().extend({
  title: optionalTrimmedString({ max: 255 }),
  description: optionalTrimmedString({ max: 20000 }),
});

export const adminJobPostLifecycleSchema = z
  .object({
    publishedAt: z.union([optionalTrimmedString({ max: 64 }), z.date()]).optional(),
  })
  .strip();

export const adminJobPostArchiveSchema = z
  .object({
    reason: optionalTrimmedString({ max: 255 }),
  })
  .strip();
