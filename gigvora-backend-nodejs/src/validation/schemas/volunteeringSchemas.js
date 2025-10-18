import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import {
  VOLUNTEERING_POST_STATUSES,
  VOLUNTEERING_APPLICATION_STATUSES,
  VOLUNTEERING_RESPONSE_TYPES,
  VOLUNTEERING_INTERVIEW_STATUSES,
  VOLUNTEERING_CONTRACT_STATUSES,
  VOLUNTEERING_CONTRACT_TYPES,
} from '../../models/volunteeringModels.js';

function optionalDateValue() {
  return z
    .union([z.date(), z.string().trim().min(1), z.number()])
    .optional()
    .transform((value, ctx) => {
      if (value == null) {
        return undefined;
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid date.' });
        return z.NEVER;
      }
      return date;
    });
}

function optionalJsonValue() {
  return z.any().optional();
}

const workspaceContextSchema = z
  .object({
    workspaceId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    workspaceSlug: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

const postStatusSchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !VOLUNTEERING_POST_STATUSES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must be a valid volunteering post status.' });
    }
  });

const applicationStatusSchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !VOLUNTEERING_APPLICATION_STATUSES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must be a valid application status.' });
    }
  });

const responseTypeSchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !VOLUNTEERING_RESPONSE_TYPES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'responseType must be a valid response type.' });
    }
  });

const visibilitySchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !['internal', 'candidate'].includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'visibility must be internal or candidate.' });
    }
  });

const interviewStatusSchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !VOLUNTEERING_INTERVIEW_STATUSES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must be a valid interview status.' });
    }
  });

const contractStatusSchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !VOLUNTEERING_CONTRACT_STATUSES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status must be a valid contract status.' });
    }
  });

const contractTypeSchema = optionalTrimmedString({ max: 40 })
  .transform((value) => value?.toLowerCase())
  .superRefine((value, ctx) => {
    if (value && !VOLUNTEERING_CONTRACT_TYPES.includes(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'contractType must be valid.' });
    }
  });

const dashboardQuerySchema = workspaceContextSchema
  .extend({
    lookbackDays: optionalNumber({ min: 7, max: 365, precision: 0, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

const postBaseSchema = workspaceContextSchema
  .extend({
    title: requiredTrimmedString({ max: 180 }),
    summary: optionalTrimmedString({ max: 255 }).transform((value) => value ?? null),
    description: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? null),
    status: postStatusSchema,
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? null),
    remoteFriendly: optionalBoolean(),
    commitmentHours: optionalNumber({ min: 0, max: 168, precision: 2 }).transform((value) => value ?? undefined),
    applicationUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? null),
    contactEmail: optionalTrimmedString({ max: 255 }).transform((value) => value ?? null),
    startDate: optionalDateValue(),
    endDate: optionalDateValue(),
    applicationDeadline: optionalDateValue(),
    tags: optionalStringArray({ maxItemLength: 120 }).transform((value) => value ?? undefined),
    skills: optionalStringArray({ maxItemLength: 120 }).transform((value) => value ?? undefined),
    benefits: optionalJsonValue(),
    requirements: optionalJsonValue(),
    metadata: optionalJsonValue(),
  })
  .strip();

const updatePostBodySchema = workspaceContextSchema
  .extend({
    title: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    summary: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    status: postStatusSchema,
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    remoteFriendly: optionalBoolean(),
    commitmentHours: optionalNumber({ min: 0, max: 168, precision: 2 }).transform((value) => value ?? undefined),
    applicationUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    contactEmail: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    startDate: optionalDateValue(),
    endDate: optionalDateValue(),
    applicationDeadline: optionalDateValue(),
    tags: optionalStringArray({ maxItemLength: 120 }).transform((value) => value ?? undefined),
    skills: optionalStringArray({ maxItemLength: 120 }).transform((value) => value ?? undefined),
    benefits: optionalJsonValue(),
    requirements: optionalJsonValue(),
    metadata: optionalJsonValue(),
  })
  .strip();

const applicationBaseSchema = workspaceContextSchema
  .extend({
    candidateName: requiredTrimmedString({ max: 180 }),
    candidateEmail: optionalTrimmedString({ max: 255 }).transform((value) => value ?? null),
    candidatePhone: optionalTrimmedString({ max: 60 }).transform((value) => value ?? null),
    resumeUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? null),
    portfolioUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? null),
    coverLetter: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? null),
    status: applicationStatusSchema,
    stage: optionalTrimmedString({ max: 120 }).transform((value) => value ?? null),
    submittedAt: optionalDateValue(),
    reviewedAt: optionalDateValue(),
    assignedTo: optionalTrimmedString({ max: 180 }).transform((value) => value ?? null),
    source: optionalTrimmedString({ max: 120 }).transform((value) => value ?? null),
    notes: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? null),
    metadata: optionalJsonValue(),
  })
  .strip();

const updateApplicationBodySchema = workspaceContextSchema
  .extend({
    candidateName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    candidateEmail: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    candidatePhone: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    resumeUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    portfolioUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    coverLetter: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    status: applicationStatusSchema,
    stage: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    submittedAt: optionalDateValue(),
    reviewedAt: optionalDateValue(),
    assignedTo: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    source: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    metadata: optionalJsonValue(),
  })
  .strip();

const responseBodySchema = workspaceContextSchema
  .extend({
    actorId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    actorName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    actorRole: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    responseType: responseTypeSchema,
    visibility: visibilitySchema,
    message: requiredTrimmedString({ max: 10000 }),
    attachments: optionalJsonValue(),
    sentAt: optionalDateValue(),
    metadata: optionalJsonValue(),
  })
  .strip();

const updateResponseBodySchema = workspaceContextSchema
  .extend({
    actorId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    actorName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    actorRole: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    responseType: responseTypeSchema,
    visibility: visibilitySchema,
    message: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    attachments: optionalJsonValue(),
    sentAt: optionalDateValue(),
    metadata: optionalJsonValue(),
  })
  .strip();

const interviewBodySchema = workspaceContextSchema
  .extend({
    scheduledAt: optionalDateValue(),
    durationMinutes: optionalNumber({ min: 0, max: 1440, precision: 0, integer: true }).transform((value) => value ?? undefined),
    interviewerName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    interviewerEmail: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    meetingUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    status: interviewStatusSchema,
    feedback: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    score: optionalNumber({ min: 0, max: 10, precision: 2 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    metadata: optionalJsonValue(),
  })
  .strip();

const contractBodySchema = workspaceContextSchema
  .extend({
    title: requiredTrimmedString({ max: 200 }),
    status: contractStatusSchema,
    contractType: contractTypeSchema,
    startDate: optionalDateValue(),
    endDate: optionalDateValue(),
    hoursPerWeek: optionalNumber({ min: 0, max: 168, precision: 2 }).transform((value) => value ?? undefined),
    stipendAmount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    currency: optionalTrimmedString({ max: 6 }).transform((value) => value ?? undefined),
    deliverables: optionalJsonValue(),
    terms: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    metadata: optionalJsonValue(),
  })
  .strip();

const updateContractBodySchema = workspaceContextSchema
  .extend({
    title: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    status: contractStatusSchema,
    contractType: contractTypeSchema,
    startDate: optionalDateValue(),
    endDate: optionalDateValue(),
    hoursPerWeek: optionalNumber({ min: 0, max: 168, precision: 2 }).transform((value) => value ?? undefined),
    stipendAmount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    currency: optionalTrimmedString({ max: 6 }).transform((value) => value ?? undefined),
    deliverables: optionalJsonValue(),
    terms: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    metadata: optionalJsonValue(),
  })
  .strip();

const spendBodySchema = workspaceContextSchema
  .extend({
    amount: optionalNumber({ min: 0, precision: 2 }).transform((value) => value ?? undefined),
    currency: optionalTrimmedString({ max: 6 }).transform((value) => value ?? undefined),
    category: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    description: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    spentAt: optionalDateValue(),
    receiptUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    metadata: optionalJsonValue(),
  })
  .strip();

const postIdParamsSchema = z
  .object({
    postId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'postId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

const applicationIdParamsSchema = z
  .object({
    applicationId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'applicationId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

const responseIdParamsSchema = z
  .object({
    responseId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'responseId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

const interviewIdParamsSchema = z
  .object({
    interviewId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'interviewId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

const contractIdParamsSchema = z
  .object({
    contractId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'contractId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

const spendIdParamsSchema = z
  .object({
    spendId: z
      .any()
      .transform((value, ctx) => {
        const numeric = Number(value);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'spendId must be a positive integer.' });
          return z.NEVER;
        }
        return numeric;
      }),
  })
  .strip();

export const volunteeringDashboardQuerySchema = dashboardQuerySchema;
export const createVolunteeringPostBodySchema = postBaseSchema;
export const updateVolunteeringPostBodySchema = updatePostBodySchema;
export const createVolunteeringApplicationBodySchema = applicationBaseSchema;
export const updateVolunteeringApplicationBodySchema = updateApplicationBodySchema;
export const createVolunteeringResponseBodySchema = responseBodySchema;
export const updateVolunteeringResponseBodySchema = updateResponseBodySchema;
export const volunteeringInterviewBodySchema = interviewBodySchema;
export const volunteeringContractBodySchema = contractBodySchema;
export const updateVolunteeringContractBodySchema = updateContractBodySchema;
export const volunteeringSpendBodySchema = spendBodySchema;
export const volunteeringWorkspaceContextSchema = workspaceContextSchema;
export const volunteeringPostIdParamsSchema = postIdParamsSchema;
export const volunteeringApplicationIdParamsSchema = applicationIdParamsSchema;
export const volunteeringResponseIdParamsSchema = responseIdParamsSchema;
export const volunteeringInterviewIdParamsSchema = interviewIdParamsSchema;
export const volunteeringContractIdParamsSchema = contractIdParamsSchema;
export const volunteeringSpendIdParamsSchema = spendIdParamsSchema;
