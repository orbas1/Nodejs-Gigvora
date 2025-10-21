import { z } from 'zod';
import {
  SPRINT_STATUSES,
  SPRINT_TASK_STATUSES,
  SPRINT_TASK_PRIORITIES,
  SPRINT_RISK_STATUSES,
  SPRINT_RISK_IMPACTS,
  CHANGE_REQUEST_STATUSES,
} from '../../models/constants/index.js';

const numericId = z.coerce.number().int().positive();

const optionalString = (max = 2048) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const text = `${value}`.trim();
      return text.length ? text.slice(0, max) : null;
    })
    .optional();

const requiredString = (min = 1, max = 2048) =>
  z.preprocess(
    (value) => {
      if (value == null) {
        return value;
      }
      return `${value}`.trim();
    },
    z
      .string()
      .min(min, { message: `Must be at least ${min} characters long` })
      .max(max, { message: `Must be at most ${max} characters long` }),
  );

const metadataSchema = z
  .union([z.record(z.string(), z.any()), z.null(), z.undefined()])
  .transform((value) => {
    if (!value || typeof value !== 'object') {
      return null;
    }
    return JSON.parse(JSON.stringify(value));
  })
  .optional();

const dateSchema = z
  .union([z.coerce.date(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return null;
    }
    return value;
  });

const numberSchema = ({ min = -Infinity, max = Infinity, precision } = {}) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null || value === '') {
        return null;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return null;
      }
      if (numeric < min || numeric > max) {
        return null;
      }
      if (typeof precision === 'number') {
        return Number(numeric.toFixed(precision));
      }
      return numeric;
    })
    .optional();

export const workManagementProjectParamsSchema = z.object({
  projectId: numericId,
});

export const workManagementSprintParamsSchema = workManagementProjectParamsSchema.extend({
  sprintId: numericId,
});

export const workManagementTaskParamsSchema = workManagementProjectParamsSchema.extend({
  taskId: numericId,
});

export const workManagementRiskParamsSchema = workManagementProjectParamsSchema.extend({
  riskId: numericId,
});

export const workManagementChangeRequestParamsSchema = workManagementProjectParamsSchema.extend({
  changeRequestId: numericId,
});

export const workManagementSprintCreateSchema = z
  .object({
    name: requiredString(3, 180),
    goal: optionalString(2000),
    status: z.enum(SPRINT_STATUSES).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    velocityTarget: numberSchema({ min: 0, max: 10000, precision: 2 }),
    actorId: numericId.optional(),
  })
  .strict();

export const workManagementSprintUpdateSchema = workManagementSprintCreateSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one sprint field must be provided.',
  });

export const workManagementTaskCreateSchema = z
  .object({
    title: requiredString(3, 255),
    description: optionalString(8000),
    status: z.enum(SPRINT_TASK_STATUSES).optional(),
    type: optionalString(120),
    priority: z.enum(SPRINT_TASK_PRIORITIES).optional(),
    storyPoints: numberSchema({ min: 0, max: 1000, precision: 2 }),
    sequence: numberSchema({ min: 0, max: 100000 }).optional(),
    sprintId: numericId.optional(),
    assigneeId: numericId.optional(),
    reporterId: numericId.optional(),
    dueDate: dateSchema.optional(),
    startedAt: dateSchema.optional(),
    completedAt: dateSchema.optional(),
    blockedReason: optionalString(4000),
    dependencies: z.array(numericId).optional(),
    metadata: metadataSchema,
    actorId: numericId.optional(),
  })
  .strict();

export const workManagementTaskUpdateSchema = workManagementTaskCreateSchema.partial()
  .extend({
    sprintId: z.union([numericId, z.literal(null)]).optional(),
    dependencies: z.union([z.array(numericId), z.literal(null)]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one task field must be provided.',
  });

export const workManagementTimeLogSchema = z
  .object({
    userId: numericId.optional(),
    actorId: numericId.optional(),
    minutesSpent: numberSchema({ min: 1, max: 24 * 60 }),
    startedAt: dateSchema.optional(),
    endedAt: dateSchema.optional(),
    billable: z.union([z.boolean(), z.number(), z.string(), z.undefined()]).transform((value) => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (value == null) {
        return false;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      const normalised = `${value}`.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(normalised)) {
        return true;
      }
      if (['0', 'false', 'no', 'off'].includes(normalised)) {
        return false;
      }
      return false;
    }),
    hourlyRate: numberSchema({ min: 0, max: 10000, precision: 2 }),
    notes: optionalString(2000),
  })
  .strict();

export const workManagementRiskCreateSchema = z
  .object({
    title: requiredString(3, 255),
    description: optionalString(4000),
    sprintId: numericId.optional(),
    taskId: numericId.optional(),
    ownerId: numericId.optional(),
    probability: numberSchema({ min: 0, max: 1, precision: 2 }),
    severityScore: numberSchema({ min: 0, max: 100, precision: 2 }),
    status: z.enum(SPRINT_RISK_STATUSES).optional(),
    impact: z.enum(SPRINT_RISK_IMPACTS).optional(),
    mitigationPlan: optionalString(4000),
    responseStrategy: optionalString(4000),
    metadata: metadataSchema,
    actorId: numericId.optional(),
  })
  .strict();

export const workManagementRiskUpdateSchema = workManagementRiskCreateSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one risk field must be provided.',
  });

export const workManagementChangeRequestCreateSchema = z
  .object({
    title: requiredString(3, 255),
    description: optionalString(4000),
    justification: optionalString(4000),
    impactAssessment: optionalString(4000),
    requestedById: numericId.optional(),
    sprintId: numericId.optional(),
    taskId: numericId.optional(),
    status: z.enum(CHANGE_REQUEST_STATUSES).optional(),
    metadata: metadataSchema,
    actorId: numericId.optional(),
  })
  .strict();

export const workManagementChangeRequestUpdateSchema = workManagementChangeRequestCreateSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one change request field must be provided.',
  });

export const workManagementChangeRequestApprovalSchema = z
  .object({
    approvedById: numericId.optional(),
    actorId: numericId.optional(),
    status: z.enum(['approved', 'rejected']).optional(),
    approvalMetadata: metadataSchema,
    eSignDocumentUrl: optionalString(2048),
    eSignAuditTrail: metadataSchema,
    decisionNotes: optionalString(4000),
  })
  .strict()
  .refine((value) => value.approvedById != null || value.actorId != null, {
    message: 'approvedById or actorId must be provided to approve a change request.',
  });

export default {
  workManagementProjectParamsSchema,
  workManagementSprintParamsSchema,
  workManagementTaskParamsSchema,
  workManagementRiskParamsSchema,
  workManagementChangeRequestParamsSchema,
  workManagementSprintCreateSchema,
  workManagementSprintUpdateSchema,
  workManagementTaskCreateSchema,
  workManagementTaskUpdateSchema,
  workManagementTimeLogSchema,
  workManagementRiskCreateSchema,
  workManagementRiskUpdateSchema,
  workManagementChangeRequestCreateSchema,
  workManagementChangeRequestUpdateSchema,
  workManagementChangeRequestApprovalSchema,
};
