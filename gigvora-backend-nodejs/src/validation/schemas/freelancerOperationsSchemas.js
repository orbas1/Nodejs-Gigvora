import { z } from 'zod';

const positiveInt = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new Error('Must be a positive integer');
    }
    return numeric;
  });

const identifierSchema = z.union([z.string().trim().min(1).max(160), z.number().int().positive()]);

const metadataSchema = z.record(z.string(), z.any()).optional();

export const operationsParamsSchema = z.object({
  freelancerId: positiveInt,
});

export const operationsMembershipParamsSchema = operationsParamsSchema.extend({
  membershipId: identifierSchema,
});

export const operationsNoticeParamsSchema = operationsParamsSchema.extend({
  noticeId: identifierSchema,
});

export const operationsMembershipRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    requestedRole: z.string().trim().min(1).max(120).optional(),
    reason: z.string().trim().min(1).max(400).optional(),
    notes: z.string().trim().min(1).max(400).optional(),
    metadata: metadataSchema,
  })
  .strict();

export const operationsMembershipUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    role: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(600).optional(),
    status: z.enum(['active', 'invited', 'available', 'requested', 'suspended']).optional(),
    lastReviewedAt: z.string().datetime({ message: 'lastReviewedAt must be an ISO datetime string' }).optional(),
    metadata: metadataSchema,
  })
  .strict();

export const operationsSyncBodySchema = z.object({}).optional();

export default {
  operationsParamsSchema,
  operationsMembershipParamsSchema,
  operationsNoticeParamsSchema,
  operationsMembershipRequestSchema,
  operationsMembershipUpdateSchema,
  operationsSyncBodySchema,
};
