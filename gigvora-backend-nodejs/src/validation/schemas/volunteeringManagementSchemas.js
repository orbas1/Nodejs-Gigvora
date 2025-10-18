import { z } from 'zod';
import {
  VOLUNTEER_APPLICATION_STATUSES,
  VOLUNTEER_RESPONSE_TYPES,
  VOLUNTEER_CONTRACT_STATUSES,
  VOLUNTEER_SPEND_CATEGORIES,
} from '../../models/constants/index.js';

const isoDateString = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'Must be a valid ISO date string.',
  });

const metadataSchema = z
  .union([z.object({}).passthrough(), z.array(z.any())])
  .optional();

export const volunteerParamsSchema = z
  .object({
    id: z.coerce.number().int().positive({ message: 'id must be a positive integer.' }),
  })
  .strip();

export const applicationParamsSchema = volunteerParamsSchema.extend({
  applicationId: z.coerce.number().int().positive({ message: 'applicationId must be a positive integer.' }),
});

export const responseParamsSchema = applicationParamsSchema.extend({
  responseId: z.coerce.number().int().positive({ message: 'responseId must be a positive integer.' }),
});

export const spendParamsSchema = applicationParamsSchema.extend({
  spendId: z.coerce.number().int().positive({ message: 'spendId must be a positive integer.' }),
});

export const reviewParamsSchema = applicationParamsSchema.extend({
  reviewId: z.coerce.number().int().positive({ message: 'reviewId must be a positive integer.' }),
});

export const createApplicationSchema = z
  .object({
    volunteeringRoleId: z.coerce.number().int().positive({ message: 'volunteeringRoleId is required.' }),
    status: z.enum(VOLUNTEER_APPLICATION_STATUSES).optional(),
    motivation: z.string().trim().max(4000).optional(),
    availabilityStart: isoDateString.optional(),
    availabilityHoursPerWeek: z.coerce.number().min(0).max(168).optional(),
    submittedAt: isoDateString.optional(),
    decisionAt: isoDateString.optional(),
    notes: z.string().trim().max(4000).optional(),
    metadata: metadataSchema,
  })
  .strip();

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  volunteeringRoleId: z.never({ message: 'volunteeringRoleId cannot be changed.' }).optional(),
});

export const createResponseSchema = z
  .object({
    responseType: z.enum(VOLUNTEER_RESPONSE_TYPES).optional(),
    message: z.string().trim().min(1, { message: 'message is required.' }),
    requestedAction: z.string().trim().max(255).optional(),
    respondedAt: isoDateString.optional(),
    metadata: metadataSchema,
  })
  .strip();

export const updateResponseSchema = createResponseSchema.partial().extend({
  message: z.string().trim().min(1).optional(),
});

export const upsertContractSchema = z
  .object({
    status: z.enum(VOLUNTEER_CONTRACT_STATUSES).optional(),
    startDate: isoDateString.optional(),
    endDate: isoDateString.optional(),
    commitmentHours: z.coerce.number().min(0).max(1000).optional(),
    hourlyRate: z.coerce.number().min(0).optional(),
    currencyCode: z.string().trim().length(3).optional(),
    totalValue: z.coerce.number().min(0).optional(),
    spendToDate: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(4000).optional(),
    metadata: metadataSchema,
  })
  .strip();

export const createSpendSchema = z
  .object({
    amount: z.coerce.number().min(0.01, { message: 'amount must be greater than zero.' }),
    currencyCode: z.string().trim().length(3).optional(),
    category: z.enum(VOLUNTEER_SPEND_CATEGORIES).optional(),
    description: z.string().trim().max(255).optional(),
    incurredAt: isoDateString.optional(),
    metadata: metadataSchema,
  })
  .strip();

export const updateSpendSchema = createSpendSchema.partial().extend({
  amount: z.coerce.number().min(0.01).optional(),
});

export const createReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    headline: z.string().trim().max(180).optional(),
    feedback: z.string().trim().max(4000).optional(),
    visibility: z.enum(['private', 'shared']).optional(),
    publishedAt: isoDateString.optional(),
    metadata: metadataSchema,
  })
  .strip();

export const updateReviewSchema = createReviewSchema.partial();

export default {
  volunteerParamsSchema,
  applicationParamsSchema,
  responseParamsSchema,
  spendParamsSchema,
  reviewParamsSchema,
  createApplicationSchema,
  updateApplicationSchema,
  createResponseSchema,
  updateResponseSchema,
  upsertContractSchema,
  createSpendSchema,
  updateSpendSchema,
  createReviewSchema,
  updateReviewSchema,
};
