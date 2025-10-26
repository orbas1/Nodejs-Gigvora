import { z } from 'zod';

const stringOrStringArray = z.union([
  z
    .string()
    .trim()
    .min(1),
  z
    .array(z.string().trim().min(1))
    .min(1),
]);

const booleanLike = z.union([
  z.boolean(),
  z
    .string()
    .trim()
    .min(1),
]);

const positiveIntegerLike = z.union([
  z
    .number()
    .int()
    .positive(),
  z
    .string()
    .trim()
    .regex(/^[0-9]+$/),
]);

export const formBlueprintListQuerySchema = z.object({
  status: stringOrStringArray.optional(),
  persona: stringOrStringArray.optional(),
  includeSteps: booleanLike.optional(),
  includeFields: booleanLike.optional(),
  limit: positiveIntegerLike.optional(),
});

export const formBlueprintKeyParamsSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9_-]+$/i, 'key must contain only letters, numbers, underscores, or hyphens.'),
});

export const formBlueprintValidateBodySchema = z.object({
  field: z
    .string()
    .trim()
    .min(1, 'field name is required.'),
  value: z.any().optional(),
  context: z.record(z.any()).optional(),
});

export default {
  formBlueprintListQuerySchema,
  formBlueprintKeyParamsSchema,
  formBlueprintValidateBodySchema,
};
