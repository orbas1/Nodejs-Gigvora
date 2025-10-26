import { z } from 'zod';

const statusOptions = ['pending', 'in_review', 'approved', 'rejected', 'escalated', 'needs_changes'];
const priorityOptions = ['low', 'standard', 'high', 'urgent'];
const severityOptions = ['low', 'medium', 'high', 'critical'];
const actionOptions = ['assign', 'approve', 'reject', 'escalate', 'request_changes', 'restore', 'suspend', 'add_note'];

const optionalString = (max = 600) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max);

export const contentQueueQuerySchema = z
  .object({
    status: z.enum(statusOptions).optional(),
    priority: z.enum(priorityOptions).optional(),
    severity: z.enum(severityOptions).optional(),
    reviewerId: z
      .union([z.string().regex(/^\d+$/), z.number().int()])
      .transform((value) => Number.parseInt(value, 10))
      .optional(),
    team: z.string().trim().max(120).optional(),
    search: z.string().trim().max(200).optional(),
    region: z.string().trim().max(60).optional(),
    page: z
      .union([z.string().regex(/^\d+$/), z.number().int()])
      .transform((value) => Number.parseInt(value, 10))
      .default(1),
    pageSize: z
      .union([z.string().regex(/^\d+$/), z.number().int()])
      .transform((value) => Number.parseInt(value, 10))
      .default(25),
  })
  .strict();

export const submissionIdParamSchema = z
  .object({
    submissionId: z
      .union([z.string().regex(/^\d+$/), z.number().int()])
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0, 'submissionId must be positive'),
  })
  .strict();

export const updateSubmissionBodySchema = z
  .object({
    status: z.enum(statusOptions).optional(),
    priority: z.enum(priorityOptions).optional(),
    severity: z.enum(severityOptions).optional(),
    assignedReviewerId: z
      .union([z.string().regex(/^\d+$/), z.number().int(), z.null()])
      .transform((value) => (value == null ? null : Number.parseInt(value, 10)))
      .optional(),
    assignedTeam: z.string().trim().max(120).nullish(),
    rejectionReason: z.string().trim().max(600).nullish(),
    resolutionNotes: z.string().trim().max(10_000).nullish(),
    metadata: z.record(z.any()).optional(),
    riskScore: z
      .union([z.string().regex(/^\d+(\.\d+)?$/), z.number()])
      .transform((value) => Number.parseFloat(`${value}`))
      .refine((value) => value >= 0 && value <= 999.99, 'riskScore must be between 0 and 999.99')
      .optional(),
  })
  .strict();

export const assignSubmissionBodySchema = z
  .object({
    reviewerId: z
      .union([z.string().regex(/^\d+$/), z.number().int(), z.null()])
      .transform((value) => (value == null ? null : Number.parseInt(value, 10)))
      .optional(),
    team: z.string().trim().max(120).nullish(),
  })
  .strict();

export const moderationActionBodySchema = z
  .object({
    action: z.enum(actionOptions),
    severity: z.enum(severityOptions).optional(),
    priority: z.enum(priorityOptions).optional(),
    status: z.enum(statusOptions).optional(),
    reason: optionalString(600).nullish(),
    guidanceLink: z.string().trim().url().max(500).nullish(),
    resolutionSummary: optionalString(10_000).nullish(),
    metadata: z.record(z.any()).optional(),
    riskScore: z
      .union([z.string().regex(/^\d+(\.\d+)?$/), z.number()])
      .transform((value) => Number.parseFloat(`${value}`))
      .refine((value) => value >= 0 && value <= 999.99, 'riskScore must be between 0 and 999.99')
      .optional(),
    slaMinutes: z
      .union([z.string().regex(/^\d+$/), z.number().int()])
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value >= 0, 'slaMinutes must be non-negative')
      .optional(),
  })
  .strict();

export default {
  contentQueueQuerySchema,
  submissionIdParamSchema,
  updateSubmissionBodySchema,
  assignSubmissionBodySchema,
  moderationActionBodySchema,
};
